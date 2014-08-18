SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
WARN := -Wall
CXXFLAGS := ${WARN} ${ARCH} -O2 -std=c++11

LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a
LIBGA = ${LDIR}/lib-ga.a

XFILES = color
OFILES = ecMatch.o ecFmatch.o ecAltPath.o ecCheck.o

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

all:	${XFILES}

color: color.o ${OFILES} ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean:
	rm -f *.o ${XFILES}
