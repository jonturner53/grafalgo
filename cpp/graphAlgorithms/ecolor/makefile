SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
WARN := -Wall
CXXFLAGS := ${WARN} ${ARCH} -O2 -std=c++11

LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a
LIBGA = ${LDIR}/lib-ga.a

OFILES = ecolor_m.o ecolor_fm.o ecolor_v.o ecolor_g.o

${OFILES} : ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : ${LIBGA}

${LIBGA} : ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

clean:
	rm -f *.o ${XFILES}
