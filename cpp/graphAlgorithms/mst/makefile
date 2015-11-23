SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall
CXXFLAGS := ${WARN} ${ARCH} -O2 -std=c++0x

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/Graph_w.h ${IDIR}/List.h ${IDIR}/List_g.h \
	 ${IDIR}/Djheaps_ll.h ${IDIR}/Djsets_flt.h 
OFILES = mst_k.o mst_p.o mst_pf.o mst_ct.o

${OFILES} : ${HFILES}
${LIBGA} : ${OFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS} ${LIBGA}

${LIBGA}: ${OFILES} ${LIBS}
	ar -ru ${LIBGA} ${OFILES}

clean:
	rm -f *.o ${XFILES}
